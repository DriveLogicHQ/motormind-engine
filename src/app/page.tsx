import Link from "next/link";

export default function Home() {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold">MotorMind + DriveLogic Widget</h1>
      <p className="mt-3 text-gray-700">
        This project is a working "payment-first" vehicle search demo plus SmartProtect (GAP/VSC)
        monthly deltas. Deploy it (Vercel is easiest), then embed the widget URL inside LandingSite AI
        using an iframe.
      </p>

      <div className="mt-6 p-4 rounded-2xl border bg-white">
        <div className="font-semibold">Open the demo page</div>
        <Link className="text-blue-600 underline" href="/drivelogic">
          /drivelogic
        </Link>
      </div>

      <div className="mt-6 p-4 rounded-2xl border bg-white">
        <div className="font-semibold">Inventory file</div>
        <p className="mt-1 text-sm text-gray-700">
          Replace <code className="px-1 py-0.5 bg-gray-100 rounded">public/data/inventory.json</code> with your real
          exported inventory.
        </p>
      </div>

      <div className="mt-6 p-4 rounded-2xl border bg-white">
        <div className="font-semibold">LandingSite AI embed (simple)</div>
        <pre className="mt-2 text-xs overflow-auto p-3 rounded-xl bg-gray-900 text-gray-100">{`<iframe
  src="https://YOUR-DEPLOYED-URL.vercel.app/drivelogic"
  style="width: 100%; height: 850px; border: 0; border-radius: 16px;"
  loading="lazy"
></iframe>`}</pre>
      </div>

      <p className="mt-8 text-sm text-gray-500">
        Note: MotorMind GPT chat proxy is not wired in this ZIP. Once you want that, we can add an /api/chat
        route that calls OpenAI and merges inventory + intent rules.
      </p>
    </main>
  );
}
