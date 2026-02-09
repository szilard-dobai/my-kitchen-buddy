import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tag } from "@/types/tag";

export const tagKeys = {
  all: ["tags"] as const,
  lists: () => [...tagKeys.all, "list"] as const,
};

export function useTags() {
  return useQuery({
    queryKey: tagKeys.lists(),
    queryFn: async (): Promise<Tag[]> => {
      const response = await fetch("/api/tags");
      if (!response.ok) {
        throw new Error("Failed to fetch tags");
      }
      return response.json();
    },
  });
}

export function useAddRecipeToTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tagId,
      recipeId,
    }: {
      tagId: string;
      recipeId: string;
    }) => {
      const response = await fetch(`/api/tags/${tagId}/recipes/${recipeId}`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to add tag to recipe");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
    },
  });
}

export function useRemoveRecipeFromTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tagId,
      recipeId,
    }: {
      tagId: string;
      recipeId: string;
    }) => {
      const response = await fetch(`/api/tags/${tagId}/recipes/${recipeId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to remove tag from recipe");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
    },
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create tag");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tagId, name }: { tagId: string; name?: string }) => {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update tag");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagId: string) => {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete tag");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
    },
  });
}
