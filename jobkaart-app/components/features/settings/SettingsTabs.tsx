'use client'

import { useState } from 'react'
import BusinessDetailsForm from './BusinessDetailsForm'
import BankingDetailsForm from './BankingDetailsForm'
import VatBrandingForm from './VatBrandingForm'
import QuoteTemplatesSection from './QuoteTemplatesSection'
import TeamMembersSection from './TeamMembersSection'
import HelpSection from './HelpSection'

interface SettingsTabsProps {
  tenant: any
  templates: any[]
}

type Tab = 'business' | 'banking' | 'vat-branding' | 'templates' | 'team' | 'help'

export default function SettingsTabs({ tenant, templates }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('business')

  const tabs = [
    { id: 'business' as Tab, label: 'Business Details', icon: '🏢' },
    { id: 'banking' as Tab, label: 'Banking Details', icon: '🏦' },
    { id: 'vat-branding' as Tab, label: 'VAT & Branding', icon: '⚙️' },
    { id: 'templates' as Tab, label: 'Quote Templates', icon: '📄' },
    { id: 'team' as Tab, label: 'Team Members', icon: '👥' },
    { id: 'help' as Tab, label: 'Help & Support', icon: '❓' },
  ]

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        {/* MOBILE: Dropdown Menu */}
        <div className="sm:hidden">
          <label htmlFor="tab-select" className="sr-only">
            Select a tab
          </label>
          <select
            id="tab-select"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as Tab)}
            className="block w-full py-3 px-4 border-0 border-b-2 border-blue-500 focus:ring-0 focus:border-blue-500 text-base font-medium text-gray-900"
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.icon} {tab.label}
              </option>
            ))}
          </select>
        </div>

        {/* DESKTOP: Horizontal Tabs */}
        <nav className="hidden sm:flex -mb-px overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center gap-2
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'business' && <BusinessDetailsForm tenant={tenant} />}
        {activeTab === 'banking' && <BankingDetailsForm tenant={tenant} />}
        {activeTab === 'vat-branding' && <VatBrandingForm tenant={tenant} />}
        {activeTab === 'templates' && <QuoteTemplatesSection templates={templates} />}
        {activeTab === 'team' && <TeamMembersSection tenant={tenant} />}
        {activeTab === 'help' && <HelpSection />}
      </div>
    </div>
  )
}
