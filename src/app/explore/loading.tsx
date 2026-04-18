export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-[#58bdae] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#6B6560] font-body">Loading destinations...</p>
      </div>
    </div>
  );
}
