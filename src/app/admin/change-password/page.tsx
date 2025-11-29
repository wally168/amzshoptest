'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Lock, Loader2, ArrowLeft } from 'lucide-react'

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changing, setChanging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const submitChangePassword = async () => {
    setError(null)
    setSuccess(null)
    if (!currentPassword || !newPassword) {
      setError('请输入当前密码与新密码')
      return
    }
    if (newPassword.length < 6) {
      setError('新密码长度至少6位')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致')
      return
    }
    setChanging(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      })
      if (res.ok) {
        setSuccess('密码修改成功，已为安全起见退出登录，请使用新密码重新登录。')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        try { await fetch('/api/auth/logout', { method: 'POST' }) } catch {}
        setTimeout(() => { window.location.href = '/login' }, 1200)
      } else {
        const text = await res.text()
        setError(text || '修改失败，请检查当前密码是否正确')
      }
    } catch (err) {
      setError('修改失败，请稍后重试')
    } finally {
      setChanging(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部简单导航 */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center">
              <Lock className="h-6 w-6 text-blue-600" />
              <span className="ml-2 text-lg font-semibold text-gray-900">修改密码</span>
            </div>
            <Link href="/admin" className="text-gray-600 hover:text-blue-600 inline-flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" /> 返回控制台
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">当前密码</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="输入当前密码"
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">新密码</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="至少6位，建议包含字母和数字"
                autoComplete="new-password"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">确认新密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="再次输入新密码"
                autoComplete="new-password"
              />
            </div>
          </div>
          {error && (
            <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{error}</div>
          )}
          {success && (
            <div className="mt-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">{success}</div>
          )}
          <div className="flex items-center justify-end mt-6">
            <button
              type="button"
              onClick={submitChangePassword}
              disabled={changing}
              className="bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-700 transition-colors inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {changing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  修改中...
                </>
              ) : (
                <>修改密码</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}