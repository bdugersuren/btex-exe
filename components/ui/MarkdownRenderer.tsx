'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-sm max-w-none markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: ({ children }) => <h1 className="text-xl font-bold text-gray-900 mt-4 mb-2 first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold text-gray-800 mt-3 mb-2 first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold text-gray-800 mt-2 mb-1 first:mt-0">{children}</h3>,
          p:  ({ children }) => <p className="text-sm text-gray-700 leading-relaxed mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2 text-sm text-gray-700">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2 text-sm text-gray-700">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
          em:     ({ children }) => <em className="italic text-gray-700">{children}</em>,
          code: ({ children, className: cls }) => {
            const isBlock = cls?.startsWith('language-')
            return isBlock
              ? <code className="block bg-gray-100 rounded-lg px-3 py-2 text-xs font-mono text-gray-800 overflow-x-auto mb-2">{children}</code>
              : <code className="bg-gray-100 rounded px-1.5 py-0.5 text-xs font-mono text-gray-800">{children}</code>
          },
          pre:        ({ children }) => <pre className="bg-gray-100 rounded-lg p-3 overflow-x-auto mb-2 text-xs">{children}</pre>,
          blockquote: ({ children }) => <blockquote className="border-l-4 border-primary-300 pl-4 italic text-gray-600 mb-2">{children}</blockquote>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
              {children}
            </a>
          ),
          hr: () => <hr className="border-gray-200 my-3" />,
          table: ({ children }) => (
            <div className="overflow-x-auto mb-2">
              <table className="min-w-full border border-gray-200 rounded-lg text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border border-gray-200 px-3 py-1.5 bg-gray-50 font-semibold text-left text-gray-700">{children}</th>,
          td: ({ children }) => <td className="border border-gray-200 px-3 py-1.5 text-gray-700">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
