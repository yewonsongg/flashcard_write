import { TabsTriggers } from "@/renderer/features/tabs/Tabs";


export function ContentHeader() {
  
  return (
    <div className='min-w-0 w-full h-10 flex items-center shadow-[inset_0_-1px_0_0_#737373] px-2'>
      <TabsTriggers />
    </div>
  )
}