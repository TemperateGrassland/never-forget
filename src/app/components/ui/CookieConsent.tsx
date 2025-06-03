'use client'

import { useEffect, useState } from 'react'

export default function CookieConsent() {
  const [consent, setConsent] = useState<'granted' | 'denied' | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('ga_consent')
    if (saved === 'granted') {
      loadGoogleAnalytics()
      setConsent('granted')
    } else if (saved === 'denied') {
      setConsent('denied')
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('ga_consent', 'granted')
    loadGoogleAnalytics()
    setConsent('granted')
  }

  const handleDecline = () => {
    localStorage.setItem('ga_consent', 'denied')
    setConsent('denied')
  }

  if (consent !== null) return null

  return (
    <div className="fixed bottom-0 w-full bg-gray-800 text-white p-4 flex justify-between items-center z-50">
      <p className="text-sm">We use cookies to analyze site usage. Do you accept?</p>
      <div className="flex gap-2">
        <button onClick={handleAccept} className="bg-green-500 px-3 py-1 text-sm rounded">Accept</button>
        <button onClick={handleDecline} className="bg-red-500 px-3 py-1 text-sm rounded">Decline</button>
      </div>
    </div>
  )
}

function loadGoogleAnalytics() {
  const gtagScript = document.createElement('script')
  gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-RG9V6NQR4C'
  gtagScript.async = true
  document.head.appendChild(gtagScript)

  const inlineScript = document.createElement('script')
  inlineScript.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-RG9V6NQR4C');
  `
  document.head.appendChild(inlineScript)
}