'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // You can log the error to an error reporting service
    // console.error(error)
  }, [error])

  return (
    <div className="mx-auto max-w-2xl py-16">
      <h2 className="text-xl font-semibold mb-2">页面出错了</h2>
      <p className="text-sm text-gray-600 mb-6">{error?.message || 'Unknown error'}</p>
      <button onClick={() => reset()} className="rounded bg-black text-white px-4 py-2">重试</button>
    </div>
  )
}


