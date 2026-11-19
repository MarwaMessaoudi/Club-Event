import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../api/profile.api';

export function useProfile() {
  return useQuery({ queryKey: ['profile','me'], queryFn: profileApi.getMe });
}
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: profileApi.updateMe,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['profile','me'] }); qc.invalidateQueries({ queryKey: ['auth'] }); }
  });
}
export function useChangePassword() {
  return useMutation({ mutationFn: profileApi.changePassword });
}