import React from 'react';
import { Tabs } from '@radix-ui/react-tabs';
import { ContentHeader } from './ContentHeader';
import { ContentBody } from './ContentBody';
import { useTabsStore } from '@/renderer/features/tabs/useTabsStore';

export function ContentArea() { 
  const tabs = useTabsStore((state) => state.tabs);
  const activeTabId = useTabsStore((state) => state.activeTabId);
  const setActiveTabId = useTabsStore((state) => state.setActiveTabId);

  if (tabs.length === 0) {
    return (
      <div className='bg-background min-w-0 w-full min-h-0 h-full flex flex-col'>
        <ContentHeader />
        <ContentBody />
      </div>
    )
  }

  return (
    <div className='bg-background min-w-0 w-full min-h-0 h-full flex flex-col'>
      <Tabs
        value={activeTabId ?? tabs[0].id}
        onValueChange={setActiveTabId}
        className='flex flex-col flex-1 min-h-0'
      >
        <ContentHeader />
        <ContentBody />
      </Tabs>
    </div>
  )
}
