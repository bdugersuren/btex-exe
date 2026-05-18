export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 to-primary-700">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">BTEC IT Evaluator</h1>
          <p className="text-primary-100 mt-2">Pearson BTEC International Level 3</p>
        </div>
        {children}
      </div>
    </div>
  )
}
