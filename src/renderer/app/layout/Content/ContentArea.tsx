import React, { useState } from 'react';
import { ContentHeader } from './ContentHeader';
import { ContentBody } from './ContentBody';

export function ContentArea() { 
  return (
    <div className='bg-zinc-50 min-w-0 w-full min-h-0 h-full flex flex-col'>
      <ContentHeader />
      <ContentBody />
    </div>
  )
}