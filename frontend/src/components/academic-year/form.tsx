import type { academicYear } from "@/types";
import { Controller, useForm } from "react-hook-form";
import { formSchema, type FormValues } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field";
import { CustomInput } from "../global/CustomInput";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { Checkbox } from "../ui/checkbox";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData: academicYear | null;
    onSuccess: () => void;
}

export const AcademicYearForm = ({
    open,
    onOpenChange,
    initialData,
    onSuccess,
}: Props) => {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            isCurrent: false,
        },
    });
    // Reset form when dialog opens or data changes
    useEffect(() => {
        if (initialData) {
            form.reset({
                name: initialData.name,
                fromYear: new Date(initialData.fromYear),
                toYear: new Date(initialData.toYear),
                isCurrent: initialData.isCurrent,
            });
        } else {
            form.reset({
                name: "",
                fromYear: undefined,
                toYear: undefined,
                isCurrent: false,
            });
        }
    }, [initialData, form, open]);

    const onSubmit = async (data: FormValues) => {
        try {
            if (initialData) {
                await api.patch(
                    `/academic-years/update/${initialData._id}`,
                    data,
                );
                toast.success("Academic Year Updated");
            } else {
                await api.post("/academic-years/create", data);
                toast.success("Academic Year Created");
            }
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.log(error);
            toast.error("Failed To Save Academic Year");
        }
    };
    const pending = form.formState.isSubmitting;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-106.25">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? "Edit Year" : "New Academic Year"}
                    </DialogTitle>
                    <DialogDescription>
                        Set The Duration For This Session.
                    </DialogDescription>
                </DialogHeader>
                {/* form */}
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <FieldGroup className="space-y-2">
                        {/* Name Field */}
                        <CustomInput
                            control={form.control}
                            name="name"
                            label="Year Name"
                            placeholder="2026"
                            disabled={pending}
                        />
                        {/* date grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Start Date */}
                            <Controller
                                name="fromYear"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel>Start Date</FieldLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value &&
                                                            "text-muted-foreground",
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(
                                                            field.value,
                                                            "PPP",
                                                        )
                                                    ) : (
                                                        <span>Pick a Date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-auto p-0"
                                                align="start"
                                            >
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    autoFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        {fieldState.invalid && (
                                            <FieldError
                                                errors={[fieldState.error]}
                                            />
                                        )}
                                    </Field>
                                )}
                            />
                            {/* End Date */}
                            <Controller
                                name="toYear"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel>End Date</FieldLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value &&
                                                            "text-muted-foreground",
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(
                                                            field.value,
                                                            "PPP",
                                                        )
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-auto p-0"
                                                align="start"
                                            >
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date <
                                                        form.getValues(
                                                            "fromYear",
                                                        )
                                                    }
                                                    autoFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        {fieldState.invalid && (
                                            <FieldError
                                                errors={[fieldState.error]}
                                            />
                                        )}
                                    </Field>
                                )}
                            />
                        </div>
                        {/* Checkbox */}
                        <Controller
                            name="isCurrent"
                            control={form.control}
                            render={({
                                field: { value, onChange, ...field },
                            }) => (
                                <Field>
                                    <div className="flex gap-2 rounded-md border p-4">
                                        <Checkbox
                                            id="isCurrent"
                                            checked={value}
                                            onCheckedChange={onChange}
                                            {...field}
                                        />
                                        <div className="space-y-1 leading-none">
                                            <FieldLabel
                                                htmlFor="isCurrent"
                                                className="cursor-pointer"
                                            >
                                                Set as Active
                                            </FieldLabel>
                                            <p className="text-[0.8rem] text-muted-foreground mt-1">
                                                Automatically Deactivates
                                                Others.
                                            </p>
                                        </div>
                                    </div>
                                </Field>
                            )}
                        />
                    </FieldGroup>
                    <DialogFooter className="mt-6">
                        <Button
                            type="submit"
                            disabled={form.formState.isSubmitting}
                            className="w-full"
                        >
                            {form.formState.isSubmitting
                                ? "Saving..."
                                : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
