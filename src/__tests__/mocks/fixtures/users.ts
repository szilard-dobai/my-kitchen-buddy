export const mockUser = {
  id: "user-123",
  email: "test@example.com",
  name: "Test User",
  emailVerified: true,
  image: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

export const mockSession = {
  user: mockUser,
  session: {
    id: "session-123",
    userId: mockUser.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
};

export const mockOtherUser = {
  id: "user-456",
  email: "other@example.com",
  name: "Other User",
  emailVerified: true,
  image: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

export const mockOtherSession = {
  user: mockOtherUser,
  session: {
    id: "session-456",
    userId: mockOtherUser.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
};
