import { useEffect } from 'react';

export function useDocumentTitle(title: string, prevailOnUnmount = false) {
  useEffect(() => {
    const defaultTitle = "LAUTECH Market | Buy & Sell in Ogbomosho | Student Marketplace Oyo State";
    document.title = title ? `${title} | ${defaultTitle}` : defaultTitle;

    return () => {
      if (!prevailOnUnmount) {
        document.title = defaultTitle;
      }
    };
  }, [title, prevailOnUnmount]);
}