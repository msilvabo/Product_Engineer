'use client';

export const dynamic = 'force-dynamic';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="min-h-screen flex items-center justify-center p-4 bg-slate-100 text-slate-800">
        <div className="bg-white p-6 rounded-2xl shadow-md max-w-md w-full text-center space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Algo salió mal</h2>
          <p className="text-xs text-slate-600">Ha ocurrido un error inesperado en la aplicación.</p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-700 cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
