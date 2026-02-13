import { useEffect, useState } from 'react';
import axios from 'axios';

import { API_BASE_URL } from '@/constants/api';

// Hook to fetch today's steps from the backend.
// The backend can later be wired to Google Fit or another real data source.
export function useGoogleFitSteps() {
  const [stepsToday, setStepsToday] = useState<number | null>(null);

  useEffect(() => {
    const fetchSteps = async () => {
      try {
        const res = await axios.get<{ steps: number }>(`${API_BASE_URL}/steps-today`);
        setStepsToday(res.data.steps);
      } catch (e) {
        console.log('Error fetching steps', e);
      }
    };

    fetchSteps();
  }, []);

  return { stepsToday };
}



