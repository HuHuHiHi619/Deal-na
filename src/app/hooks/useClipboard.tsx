'use client';
import { useState } from 'react'

function useClipboard() {
    const [isCopied , setIsCopied] = useState(false)

    const copyToClipboard = async (text : string) => {
        try{
            if(navigator.clipboard && window.isSecureContext){
                await navigator.clipboard.writeText(text)
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                textarea.setSelectionRange(0, 99999); // For mobile devices
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }
            setIsCopied(true)
            setTimeout(() => setIsCopied(false), 2000);
            return true
        }catch(error){
            console.error('failed to copy to clipboard', error);
            return false
        }
    }
  return { isCopied , copyToClipboard }
}

export default useClipboard