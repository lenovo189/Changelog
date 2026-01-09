import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="flex-1 w-full flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    );
}
