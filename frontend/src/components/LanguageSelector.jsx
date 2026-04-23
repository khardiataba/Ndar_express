import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function LanguageSelector() {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const languages = [
    { code: 'fr', label: '🇫🇷 Français', flag: '🇫🇷' },
    { code: 'wo', label: '🇸🇳 Wolof', flag: '🇸🇳' },
    { code: 'en', label: '🇬🇧 English', flag: '🇬🇧' }
  ]

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0]

  const handleLanguageChange = (code) => {
    i18n.changeLanguage(code)
    localStorage.setItem('language', code)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {/* Language Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-200 rounded-lg transition flex items-center gap-2 font-bold text-sm"
        title="Changer la langue / Jël wot jàngal"
      >
        <span className="text-xl">{currentLang.flag}</span>
        <span className="hidden sm:inline">{currentLang.code.toUpperCase()}</span>
        <span className="text-lg">▼</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-12 right-0 bg-white border-2 border-gray-300 rounded-xl shadow-lg z-50 min-w-[180px]">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full text-left px-4 py-3 hover:bg-[#1260a1] hover:text-white transition font-semibold flex items-center gap-2
                ${i18n.language === lang.code ? 'bg-[#1260a1] text-white' : 'text-gray-800'}
              `}
            >
              <span className="text-xl">{lang.flag}</span>
              {lang.label}
              {i18n.language === lang.code && <span className="ml-auto">OK</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

