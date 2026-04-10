import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";

export function LabeledVarInput({
    label, value, vars, secrets, onChange,
}: {
    label: string;
    value: string;
    vars: string[];
    secrets: string[];
    onChange: (v: string) => void;
}) {
    return (
        <div className="space-y-1 flex-1">
            <p className="text-[11px] text-foreground tracking-wider">{label}</p>
            <Select onValueChange={onChange} value={value}>
                <SelectTrigger className="w-full max-w-64 border-transparent ">
                    <SelectValue placeholder="Select a variable" >
                        {value}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {
                        secrets.length > 0 && (
                            <SelectGroup>
                                <SelectLabel>Secrets</SelectLabel>
                                {secrets.map((item, index) =>
                                    <SelectItem key={index} value={item}>{item}</SelectItem>
                                )}
                            </SelectGroup>
                        )
                    }
                    {
                        vars.length > 0 && (
                            <SelectGroup>
                                <SelectLabel>Variables</SelectLabel>
                                {vars.map((item, index) =>
                                    <SelectItem key={index} value={item}>{item}</SelectItem>
                                )}
                            </SelectGroup>
                        )
                    }
                </SelectContent>
            </Select>
        </div>
    );
}