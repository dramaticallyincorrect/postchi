import { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { FileUp, File, X } from 'lucide-react';

type ImportFormat = 'postman';

interface FormatInfo {
    label: string;
    accept: Record<string, string[]>;
    supportedVersions: string;
}

const FORMAT_INFO: Record<ImportFormat, FormatInfo> = {
    postman: {
        label: 'Postman',
        accept: { 'application/json': ['.json'] },
        supportedVersions: 'Supports Postman Collection v2.0 and v2.1 (.json)',
    },
};

interface ImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImport: (format: ImportFormat, file: File) => Promise<void>;
}

export function ImportDialog({ open, onOpenChange, onImport }: ImportDialogProps) {
    const [format, setFormat] = useState<ImportFormat>('postman');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const info = FORMAT_INFO[format];

    const onDrop = useCallback((accepted: File[]) => {
        console.log('Importing file:', accepted[0]);
        if (accepted[0]) {
            setFile(accepted[0]);
            handleImport(accepted[0]);
        }
    }, []);

    const accept = useMemo(() => info.accept, [format]);


    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: accept,
        maxFiles: 1,
        onDrop,
    });

    const handleFormatChange = (val: ImportFormat) => {
        setFormat(val);
        setFile(null);
    };

    const handleImport = async (file: File) => {
        if (!file) return;
        setLoading(true);
        try {
            await onImport(format, file);
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        onOpenChange(false);
        setFile(null);
        setFormat('postman');
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-115">
                <DialogHeader>
                    <DialogTitle>Import Requests</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-1">
                    <Select value={format} onValueChange={handleFormatChange}>
                        <SelectTrigger className='w-full'>
                            <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="postman">Postman</SelectItem>
                        </SelectContent>
                    </Select>

                    <div
                        {...getRootProps()}
                        className={[
                            'relative flex flex-col items-center justify-center gap-3',
                            'rounded-lg border-2 border-dashed px-6 py-10 text-center',
                            'cursor-pointer transition-colors duration-150',
                            isDragActive
                                ? 'border-primary text-primary bg-primary'
                                : 'border-border text-muted-foreground hover:border-primary/40 hover:bg-accent/50',
                        ].join(' ')}
                    >
                        <input {...getInputProps()} />

                        {file ? (
                            <>
                                <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm text-foreground shadow-sm">
                                    <File className="h-4 w-4 shrink-0 text-primary" />
                                    <span className="max-w-70 truncate">{file.name}</span>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                        className="ml-1 rounded hover:text-destructive transition-colors"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                                <p className="text-xs">Click or drop to replace</p>
                            </>
                        ) : (
                            <>
                                <div className={[
                                    'rounded-full border-2 p-3 transition-colors',
                                    isDragActive ? 'border-primary/40 bg-primary/10' : 'border-border bg-muted',
                                ].join(' ')}>
                                    <FileUp className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">
                                        {isDragActive ? 'Drop your file here' : 'Drag & drop your file here'}
                                    </p>
                                    <p className="mt-0.5 text-xs">or click to browse</p>
                                </div>
                            </>
                        )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                        {info.supportedVersions}
                    </p>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" >
                            Close
                        </Button>
                    </DialogClose>

                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}