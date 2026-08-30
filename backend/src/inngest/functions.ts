import { inngest } from "./client";

import Class from "../models/class";
import User from "../models/user";
import Timetable from "../models/timetable";
import Exam from "../models/exam";
import Submission from "../models/submission";

import { NonRetriableError, eventType } from "inngest";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { z } from "zod";

/**
 * --------------------------------------------------------------------------
 * Types
 * --------------------------------------------------------------------------
 */

interface GenSettings {
    startTime: string;
    endTime: string;
    periods: number;
}

interface GenerateTimetableEvent {
    classId: string;
    academicYearId: string;
    settings: GenSettings;
}

interface GenerateExamEvent {
    examId: string;
    topic: string;
    subjectName: string;
    difficulty: string;
    count: number;
}

interface SubmitExamEvent {
    examId: string;
    studentId: string;
    answers: Array<{
        questionId: string;
        answer: string;
    }>;
}

/**
 * --------------------------------------------------------------------------
 * Event definitions
 *
 * Inngest v4 supports eventType() with schemas.
 * This gives you both TypeScript inference and runtime validation.
 * --------------------------------------------------------------------------
 */

export const generateTimetableEvent = eventType("generate/timetable", {
    schema: z.object({
        classId: z.string(),
        academicYearId: z.string(),
        settings: z.object({
            startTime: z.string(),
            endTime: z.string(),
            periods: z.number().int().positive(),
        }),
    }),
});

export const generateExamEvent = eventType("exam/generate", {
    schema: z.object({
        examId: z.string(),
        topic: z.string(),
        subjectName: z.string(),
        difficulty: z.string(),
        count: z.number().int().positive(),
    }),
});

export const submitExamEvent = eventType("exam/submit", {
    schema: z.object({
        examId: z.string(),
        studentId: z.string(),
        answers: z.array(
            z.object({
                questionId: z.string(),
                answer: z.string(),
            }),
        ),
    }),
});

/**
 * --------------------------------------------------------------------------
 * Helpers
 * --------------------------------------------------------------------------
 */

/**
 * Create a Groq client.
 */
function getGroqClient() {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        throw new NonRetriableError("GROQ_API_KEY is missing");
    }

    return createOpenAI({
        apiKey,
        baseURL: "https://api.groq.com/openai/v1",
    });
}

/**
 * Remove Markdown code fences from an LLM response.
 */
function cleaonResponse(text: string): string {
    return text
        .replace(/^``on\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
}

/**
 * --------------------------------------------------------------------------
 * Generate Timetable
 * --------------------------------------------------------------------------
 */

export const generateTimeTable = inngest.createFunction(
    {
        id: "Generate-Timetable",
        name: "Generate Timetable",
        triggers: [generateTimetableEvent],
    },

    async ({ event, step }) => {
        const { classId, academicYearId, settings }: GenerateTimetableEvent =
            event.data;

        /**
         * Step 1:
         * Fetch all data required by the scheduler.
         */
        const contextData = await step.run("fetch-class-context", async () => {
            const classData =
                await Class.findById(classId).populate("subjects");

            if (!classData) {
                throw new NonRetriableError("Class not found");
            }

            const allTeachers = await User.find({
                role: "teacher",
            });

            const classSubjectsIds = classData.subjects.map((subject: any) =>
                subject._id.toString(),
            );

            /**
             * Only keep teachers who teach at least one subject
             * belonging to this class.
             */
            const qualifiedTeachers = allTeachers
                .filter((teacher: any) => {
                    if (!teacher.teacherSubject) {
                        return false;
                    }

                    return teacher.teacherSubject.some((subjectId: any) =>
                        classSubjectsIds.includes(subjectId.toString()),
                    );
                })
                .map((teacher: any) => ({
                    id: teacher._id.toString(),
                    name: teacher.name,
                    subjects: teacher.teacherSubject.map((id: any) =>
                        id.toString(),
                    ),
                }));

            const subjectsPayload = classData.subjects.map((subject: any) => ({
                id: subject._id.toString(),
                name: subject.name,
                code: subject.code,
            }));

            if (subjectsPayload.length === 0) {
                throw new NonRetriableError(
                    "No subjects are assigned to this class",
                );
            }

            if (qualifiedTeachers.length === 0) {
                throw new NonRetriableError(
                    "No qualified teachers are assigned to these subjects",
                );
            }

            return {
                className: classData.name,
                subjects: subjectsPayload,
                teachers: qualifiedTeachers,
            };
        });

        /**
         * Step 2:
         * Fetch existing timetables.
         *
         * This is kept separate from the AI generation step so that
         * Inngest can checkpoint/retry it independently.
         */
        const existingTimetables = await step.run(
            "fetch-existing-timetables",
            async () => {
                const timetables = await Timetable.find({
                    academicYear: academicYearId,
                    class: {
                        $ne: classId,
                    },
                }).lean();

                return timetables;
            },
        );

        /**
         * Step 3:
         * Generate timetable using Groq.
         */
        const aiSchedule = await step.run(
            "generate-timetable-logic",
            async () => {
                const groq = getGroqClient();

                const prompt = `
You are an expert school timetable scheduler.

Generate a weekly timetable from Monday to Friday.

CLASS:
${contextData.className}

SCHOOL HOURS:
Start: ${settings.startTime}
End: ${settings.endTime}

NUMBER OF PERIODS:
${settings.periods} periods per day.

SUBJECTS:
$ON.stringify(contextData.subjects, null, 2)}

QUALIFIED TEACHERS:
$ON.stringify(contextData.teachers, null, 2)}

OTHER CLASS TIMETABLES:
$ON.stringify(existingTimetables, null, 2)}

STRICT RULES:

1. Every scheduled subject MUST have a teacher.

2. A teacher MUST be qualified for the assigned subject.

3. A teacher MUST NOT teach two classes at the same time.

4. Avoid teacher clashes using the existing timetables.

5. Generate schedules for:
   Monday
   Tuesday
   Wednesday
   Thursday
   Friday

6. There must be exactly ${settings.periods} teaching periods per day.

7. After every 2 teaching periods, include a 10-minute break.

8. After 5 teaching periods, include a 30-minute lunch break at approximately 12:00.

9. Do not assign a teacher to a break or lunch period.

10. Use 24-hour HH:MM format for all times.

11. Subject and teacher values MUST contain their database IDs.

12. Do not invent subject IDs.

13. Do not invent teacher IDs.

14. Output ONLY validON.

OUTPUT SCHEMA:

{
  "schedule": [
    {
      "day": "Monday",
      "periods": [
        {
          "subject": "SUBJECT_ID",
          "teacher": "TEACHER_ID",
          "startTime": "HH:MM",
          "endTime": "HH:MM"
        }
      ]
    }
  ]
}

Do not wrap theON in Markdown.
`;

                const model = groq("openai/gpt-oss-20b");

                const { text } = await generateText({
                    model,
                    prompt,
                });

                const cleaon = cleaonResponse(text);

                try {
                    const parsed = JSON.parse(cleaon);

                    if (!parsed || !Array.isArray(parsed.schedule)) {
                        throw new Error(
                            "AI returned an invalid timetable structure",
                        );
                    }

                    return parsed;
                } catch (error) {
                    throw new Error(
                        `Failed to parse AI timetable response: ${
                            error instanceof Error
                                ? error.message
                                : "Unknown error"
                        }`,
                    );
                }
            },
        );

        /**
         * Step 4:
         * Save timetable.
         *
         * Existing timetable for the same class + academic year
         * is replaced to avoid duplicates.
         */
        await step.run("save-timetable", async () => {
            await Timetable.findOneAndDelete({
                class: classId,
                academicYear: academicYearId,
            });

            await Timetable.create({
                class: classId,
                academicYear: academicYearId,
                schedule: aiSchedule.schedule,
            });

            return {
                success: true,
                classId,
                academicYearId,
            };
        });

        return {
            message: "Timetable generated successfully",
            classId,
            academicYearId,
        };
    },
);

/**
 * --------------------------------------------------------------------------
 * Generate Exam
 * --------------------------------------------------------------------------
 */

export const generateExam = inngest.createFunction(
    {
        id: "Generate-Exam",
        name: "Generate Exam",
        triggers: [generateExamEvent],
    },

    async ({ event, step }) => {
        const {
            examId,
            topic,
            subjectName,
            difficulty,
            count,
        }: GenerateExamEvent = event.data;

        /**
         * Step 1:
         * Generate exam questions.
         */
        const aiExam = await step.run("generate-exam-logic", async () => {
            const groq = getGroqClient();

            const prompt = `
You are a strict high-school teacher.

Create exactly ${count} multiple-choice questions.

SUBJECT:
${subjectName}

TOPIC:
${topic}

DIFFICULTY:
${difficulty}

RULES:

1. Generate exactly ${count} questions.

2. Every question must have exactly 4 options.

3. The correctAnswer MUST exactly match one of the options.

4. Questions must be relevant to the specified subject and topic.

5. Avoid duplicate questions.

6. Do not include explanations.

7. Each question is worth 1 point.

8. Output ONLY rawON.

SCHEMA:

[
  {
    "questionText": "Question string",
    "type": "MCQ",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correctAnswer": "The exact string of the correct option",
    "points": 1
  }
]

Do not wrap theON in Markdown.
`;

            const model = groq("openai/gpt-oss-20b");

            const { text } = await generateText({
                model,
                prompt,
            });

            const cleaon = cleaonResponse(text);

            try {
                const parsed = JSON.parse(cleaon);

                if (!Array.isArray(parsed)) {
                    throw new Error("AI Returned an Invalid Exam Structure");
                }

                if (parsed.length !== count) {
                    throw new Error(
                        `Expected ${count} Questions But Received ${parsed.length}`,
                    );
                }

                /**
                 * Validate the generated questions before saving.
                 */
                for (const [index, question] of parsed.entries()) {
                    if (
                        typeof question.questionText !== "string" ||
                        question.type !== "MCQ" ||
                        !Array.isArray(question.options) ||
                        question.options.length !== 4 ||
                        typeof question.correctAnswer !== "string" ||
                        !question.options.includes(question.correctAnswer) ||
                        question.points !== 1
                    ) {
                        throw new Error(`Invalid Question At Index ${index}`);
                    }
                }

                return parsed;
            } catch (error) {
                throw new Error(
                    `Failed To Parse AI Exam Response: ${
                        error instanceof Error ? error.message : "Unknown Error"
                    }`,
                );
            }
        });

        /**
         * Step 2:
         * Save generated questions to the exam.
         */
        await step.run("save-exam", async () => {
            const exam = await Exam.findById(examId);

            if (!exam) {
                throw new NonRetriableError(`Exam ${examId} Not Found`);
            }

            exam.questions = aiExam;

            /**
             * Keep exam inactive until teacher reviews it.
             */
            exam.isActive = false;

            await exam.save();

            return {
                success: true,
                examId,
                count: aiExam.length,
            };
        });

        return {
            message: "Exam Generated Successfully",
            examId,
            count: aiExam.length,
        };
    },
);

/**
 * --------------------------------------------------------------------------
 * Handle Exam Submission
 * --------------------------------------------------------------------------
 */

export const handleExamSubmission = inngest.createFunction(
    {
        id: "Handle-Exam-Submission",
        name: "Handle Exam Submission",
        triggers: [submitExamEvent],

        /**
         * Exam submissions for the same exam/student should not
         * be processed concurrently.
         *
         * The MongoDB duplicate check below remains the actual
         * source of truth.
         */
        concurrency: {
            limit: 10,
        },
    },

    async ({ event, step }) => {
        const { examId, studentId, answers }: SubmitExamEvent = event.data;

        /**
         * Process the complete submission as one retriable step.
         */
        const result = await step.run("process-exam-submission", async () => {
            /**
             * 1. Check whether the student already submitted.
             */
            const existingSubmission = await Submission.findOne({
                exam: examId,
                student: studentId,
            });

            if (existingSubmission) {
                throw new NonRetriableError("Exam Already Submitted");
            }

            /**
             * 2. Fetch exam with correct answers.
             */
            const exam = await Exam.findById(examId).select(
                "+questions.correctAnswer",
            );

            if (!exam) {
                throw new NonRetriableError(`Exam ${examId} Not Found`);
            }

            /**
             * 3. Calculate score.
             */
            let score = 0;
            let totalPoints = 0;

            for (const question of exam.questions) {
                totalPoints += question.points;

                const studentAnswer = answers.find(
                    (answer) => answer.questionId === question._id.toString(),
                );

                if (
                    studentAnswer &&
                    studentAnswer.answer === question.correctAnswer
                ) {
                    score += question.points;
                }
            }

            /**
             * 4. Save submission.
             */
            const submission = await Submission.create({
                exam: examId,
                student: studentId,
                answers,
                score,
            });

            return {
                success: true,
                submissionId: submission._id.toString(),
                score,
                totalPoints,
            };
        });

        return {
            message: "Exam Submitted Successfully",
            ...result,
        };
    },
);
