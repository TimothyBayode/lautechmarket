import { useEffect } from 'react';

export function useDocumentTitle(title: string, prevailOnUnmount = false) {
  useEffect(() => {
    const defaultTitle = "LAUTECH Market | Find Trusted Student Vendors in Ogbomoso";
    document.title = title ? `${title} | ${defaultTitle}` : defaultTitle;

    return () => {
      if (!prevailOnUnmount) {
        document.title = defaultTitle;
      }
    };
  }, [title, prevailOnUnmount]);
}