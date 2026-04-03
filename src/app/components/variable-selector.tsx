import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function LabeledVarInput({
    label, value, existingVarNames, onChange,
}: {
    label: string;
    value: string;
    existingVarNames: string[];
    onChange: (v: string) => void;
}) {
    return (
        <div className="space-y-1 flex-1">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
            <VarInput
                value={value}
                onChange={onChange}
                existingVarNames={existingVarNames}
            />
        </div>
    );
}

export function VarInput({
    value, onChange, existingVarNames,
}: {
    value: string;
    onChange: (v: string) => void;
    existingVarNames: string[];
    placeholder?: string;
}) {

    return (
        <Select onValueChange={onChange} value={value}>
            <SelectTrigger className="w-full max-w-48">
                <SelectValue placeholder="Select a variable" >
                    {value}
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    {existingVarNames.map((item, index) =>
                        <SelectItem key={index} value={item}>{item}</SelectItem>
                    )}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
}