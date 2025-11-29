"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Plus, Tag, ArrowLeft, Trash2, Edit3 } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  image?: string | null
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/categories', { cache: 'no-store' })
      if (!res.ok) throw new Error('加载分类失败')
      const data = await res.json()
      setCategories(data)
    } catch (e: any) {
      setError(e.message || '加载分类失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该分类吗？如果该分类下存在产品，将无法删除。')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || '删除分类失败')
      }
      await load()
    } catch (e: any) {
      alert(e.message || '删除失败')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/admin" className="text-gray-600 hover:text-blue-600 mr-4">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <Tag className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-semibold text-gray-900">分类管理</span>
            </div>
            <Link
              href="/admin"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              返回控制台
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">分类管理</h1>
            <p className="text-gray-600 mt-2">添加、编辑和删除产品分类</p>
          </div>
          <Link
            href="/admin/categories/new"
            className="mt-4 sm:mt-0 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            添加分类
          </Link>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          {loading ? (
            <p className="text-gray-600">加载中...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">暂无分类，请先添加或执行数据恢复。</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories.map((c) => (
                    <tr key={c.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">{c.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{c.slug}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">
                        <Link
                          href={`/admin/categories/${c.id}/edit`}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          <Edit3 className="h-4 w-4 mr-1" /> 编辑
                        </Link>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                          disabled={deletingId === c.id}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> {deletingId === c.id ? '删除中...' : '删除'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}