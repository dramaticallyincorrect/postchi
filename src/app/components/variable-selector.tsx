import { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxEmpty } from "@/components/ui/combobox";

export function LabeledVarInput({
    label, value, existingVarNames, disabled, onChange,
}: {
    label: string;
    value: string;
    existingVarNames: string[];
    disabled: boolean;
    onChange: (v: string) => void;
}) {
    return (
        <div className="space-y-1 flex-1">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
            <VarInput
                value={value}
                onChange={onChange}
                existingVarNames={existingVarNames}
                disabled={disabled}
            />
        </div>
    );
}

export function VarInput({
    value, onChange, existingVarNames, disabled,
}: {
    value: string;
    onChange: (v: string) => void;
    existingVarNames: string[];
    disabled: boolean;
    placeholder?: string;
}) {

    return (
        <Combobox items={existingVarNames}>
            <ComboboxInput value={value} onChange={(e) => onChange(e.target.value)} placeholder="Select a framework" />
            <ComboboxContent>
                <ComboboxEmpty>No items found.</ComboboxEmpty>
                <ComboboxList>
                    {(item) => (
                        <ComboboxItem key={item} value={item}>
                            {item}
                        </ComboboxItem>
                    )}
                </ComboboxList>
            </ComboboxContent>
        </Combobox>
    );
}