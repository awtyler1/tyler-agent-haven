import { useState, useEffect } from 'react';

const AUSTIN_USER_ID = 'fbd1ced0-a34e-4ade-85f4-632a493fe3d3';

export function useDeveloperAccess(userId: string | undefined) {
  const [hasDeveloperAccess, setHasDeveloperAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Developer access is ONLY granted to Austin's user ID
    const hasAccess = userId === AUSTIN_USER_ID;
    setHasDeveloperAccess(hasAccess);
    setLoading(false);
  }, [userId]);

  return {
    hasDeveloperAccess,
    loading,
    refetch: () => {
      const hasAccess = userId === AUSTIN_USER_ID;
      setHasDeveloperAccess(hasAccess);
    },
  };
}
