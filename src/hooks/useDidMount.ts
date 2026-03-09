import { useEffect, useState } from 'react';

/**
 * @return True, if component was mounted.
 */
export function useDidMount(): boolean {
  const [didMount, setDidMount] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDidMount(true);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return didMount;
}
