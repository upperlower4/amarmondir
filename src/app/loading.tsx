export default function Loading() {
  return (
    <main className="min-h-[60vh] bg-[#fcfaf7]">
      <div className="container mx-auto px-4 py-10 space-y-6 animate-pulse">
        <div className="h-10 w-56 rounded-2xl bg-white border" />
        <div className="h-80 rounded-[2rem] bg-white border" />
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-64 rounded-[2rem] bg-white border" />
          <div className="h-64 rounded-[2rem] bg-white border" />
        </div>
      </div>
    </main>
  );
}
