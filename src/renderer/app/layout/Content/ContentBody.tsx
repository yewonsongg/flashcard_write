import { TabsRenders } from "@/renderer/features/tabs/Tabs";


export function ContentBody() {

  return (
    <div className='min-w-0 w-full min-h-0 flex-1 flex flex-col overflow-y-auto '>
      <TabsRenders />
    </div>
  )
}