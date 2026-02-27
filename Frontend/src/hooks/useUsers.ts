import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    created_at: string;
    avatar_url?: string;
}

interface CreateUserData {
    name: string;
    email: string;
    password: string;
    role: string;
}

export const useUsers = (role?: string) => {
    const { data: users = [], isLoading, error } = useQuery({
        queryKey: ["users", role],
        queryFn: async () => {
            const { data } = await api.get<User[]>(`/users`, {
                params: role ? { role } : {},
            });
            return data;
        },
    });

    return { users, isLoading, error };
};

export const useCreateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userData: CreateUserData) => {
            const { data } = await api.post(`/users`, userData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });
};

export const useBulkCreateUsers = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: { users: CreateUserData[] }) => {
            const { data } = await api.post(`/users/bulk`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });
};

export const useDeleteUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userId: string) => {
            await api.delete(`/users/${userId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });
};

export const useUpdateUserRole = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
            const { data } = await api.patch(`/users/${userId}/role`, { role });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });
};
