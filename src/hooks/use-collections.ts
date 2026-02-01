import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Collection } from "@/types/collection";

export const collectionKeys = {
  all: ["collections"] as const,
  lists: () => [...collectionKeys.all, "list"] as const,
};

export function useCollections() {
  return useQuery({
    queryKey: collectionKeys.lists(),
    queryFn: async (): Promise<Collection[]> => {
      const response = await fetch("/api/collections");
      if (!response.ok) {
        throw new Error("Failed to fetch collections");
      }
      return response.json();
    },
  });
}

export function useAddRecipeToCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      collectionId,
      recipeId,
    }: {
      collectionId: string;
      recipeId: string;
    }) => {
      const response = await fetch(
        `/api/collections/${collectionId}/recipes/${recipeId}`,
        { method: "POST" },
      );
      if (!response.ok) {
        throw new Error("Failed to add recipe to collection");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
    },
  });
}

export function useRemoveRecipeFromCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      collectionId,
      recipeId,
    }: {
      collectionId: string;
      recipeId: string;
    }) => {
      const response = await fetch(
        `/api/collections/${collectionId}/recipes/${recipeId}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        throw new Error("Failed to remove recipe from collection");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
    },
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create collection");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
    },
  });
}

export function useUpdateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      collectionId,
      name,
      color,
    }: {
      collectionId: string;
      name?: string;
      color?: string;
    }) => {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update collection");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (collectionId: string) => {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete collection");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
    },
  });
}
