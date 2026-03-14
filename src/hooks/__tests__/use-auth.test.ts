import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock server actions
const mockSignInAction = vi.fn();
const mockSignUpAction = vi.fn();
vi.mock("@/actions", () => ({
  signIn: (...args: any[]) => mockSignInAction(...args),
  signUp: (...args: any[]) => mockSignUpAction(...args),
}));

// Mock anon work tracker
const mockGetAnonWorkData = vi.fn();
const mockClearAnonWork = vi.fn();
vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: () => mockGetAnonWorkData(),
  clearAnonWork: () => mockClearAnonWork(),
}));

// Mock project actions
const mockGetProjects = vi.fn();
const mockCreateProject = vi.fn();
vi.mock("@/actions/get-projects", () => ({
  getProjects: () => mockGetProjects(),
}));
vi.mock("@/actions/create-project", () => ({
  createProject: (input: any) => mockCreateProject(input),
}));

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("returns isLoading as false initially", () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.isLoading).toBe(false);
    });

    it("returns signIn and signUp functions", () => {
      const { result } = renderHook(() => useAuth());
      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signUp).toBe("function");
    });
  });

  describe("signIn", () => {
    describe("happy paths", () => {
      it("signs in and redirects to project with anonymous work", async () => {
        const anonMessages = [{ id: "1", role: "user", content: "test" }];
        const anonFileSystemData = { "/App.jsx": { type: "file", content: "test" } };
        const createdProject = { id: "project-123" };

        mockSignInAction.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue({
          messages: anonMessages,
          fileSystemData: anonFileSystemData,
        });
        mockCreateProject.mockResolvedValue(createdProject);

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          const response = await result.current.signIn("test@example.com", "password123");
          expect(response.success).toBe(true);
        });

        expect(mockSignInAction).toHaveBeenCalledWith("test@example.com", "password123");
        expect(mockCreateProject).toHaveBeenCalledWith({
          name: expect.stringContaining("Design from"),
          messages: anonMessages,
          data: anonFileSystemData,
        });
        expect(mockClearAnonWork).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/project-123");
      });

      it("signs in and redirects to most recent project when no anonymous work", async () => {
        const existingProjects = [
          { id: "proj-1", name: "Project 1" },
          { id: "proj-2", name: "Project 2" },
        ];

        mockSignInAction.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue(null);
        mockGetProjects.mockResolvedValue(existingProjects);

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("test@example.com", "password123");
        });

        expect(mockGetProjects).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/proj-1");
        expect(mockCreateProject).not.toHaveBeenCalled();
      });

      it("signs in and creates new project when no anonymous work and no existing projects", async () => {
        const newProject = { id: "new-project-456" };

        mockSignInAction.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue(null);
        mockGetProjects.mockResolvedValue([]);
        mockCreateProject.mockResolvedValue(newProject);

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("test@example.com", "password123");
        });

        expect(mockCreateProject).toHaveBeenCalledWith({
          name: expect.stringMatching(/^New Design #\d+$/),
          messages: [],
          data: {},
        });
        expect(mockPush).toHaveBeenCalledWith("/new-project-456");
      });

      it("handles anonymous work with empty messages array", async () => {
        const existingProjects = [{ id: "proj-1", name: "Project 1" }];

        mockSignInAction.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue({
          messages: [],
          fileSystemData: {},
        });
        mockGetProjects.mockResolvedValue(existingProjects);

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("test@example.com", "password123");
        });

        // Should not create project from empty anon work
        expect(mockClearAnonWork).not.toHaveBeenCalled();
        expect(mockGetProjects).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/proj-1");
      });
    });

    describe("error handling", () => {
      it("returns error result when sign in fails", async () => {
        mockSignInAction.mockResolvedValue({
          success: false,
          error: "Invalid credentials",
        });

        const { result } = renderHook(() => useAuth());

        let response;
        await act(async () => {
          response = await result.current.signIn("test@example.com", "wrongpassword");
        });

        expect(response).toEqual({ success: false, error: "Invalid credentials" });
        expect(mockPush).not.toHaveBeenCalled();
        expect(mockGetAnonWorkData).not.toHaveBeenCalled();
      });

      it("does not redirect when sign in returns unsuccessful", async () => {
        mockSignInAction.mockResolvedValue({ success: false });

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("test@example.com", "password");
        });

        expect(mockPush).not.toHaveBeenCalled();
      });
    });

    describe("loading state", () => {
      it("sets isLoading to true during sign in and false after", async () => {
        let resolveSignIn: (value: any) => void;
        const signInPromise = new Promise((resolve) => {
          resolveSignIn = resolve;
        });
        mockSignInAction.mockReturnValue(signInPromise);
        mockGetAnonWorkData.mockReturnValue(null);
        mockGetProjects.mockResolvedValue([{ id: "1" }]);

        const { result } = renderHook(() => useAuth());

        expect(result.current.isLoading).toBe(false);

        let signInPromiseResult: Promise<any>;
        act(() => {
          signInPromiseResult = result.current.signIn("test@example.com", "password123");
        });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(true);
        });

        await act(async () => {
          resolveSignIn!({ success: true });
          await signInPromiseResult;
        });

        expect(result.current.isLoading).toBe(false);
      });

      it("sets isLoading to false even when sign in throws", async () => {
        mockSignInAction.mockRejectedValue(new Error("Network error"));

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          try {
            await result.current.signIn("test@example.com", "password123");
          } catch {
            // Expected to throw
          }
        });

        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("signUp", () => {
    describe("happy paths", () => {
      it("signs up and redirects to project with anonymous work", async () => {
        const anonMessages = [{ id: "1", role: "assistant", content: "hello" }];
        const anonFileSystemData = { "/App.jsx": { type: "file" } };
        const createdProject = { id: "signup-project-789" };

        mockSignUpAction.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue({
          messages: anonMessages,
          fileSystemData: anonFileSystemData,
        });
        mockCreateProject.mockResolvedValue(createdProject);

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          const response = await result.current.signUp("new@example.com", "newpassword123");
          expect(response.success).toBe(true);
        });

        expect(mockSignUpAction).toHaveBeenCalledWith("new@example.com", "newpassword123");
        expect(mockCreateProject).toHaveBeenCalledWith({
          name: expect.stringContaining("Design from"),
          messages: anonMessages,
          data: anonFileSystemData,
        });
        expect(mockClearAnonWork).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/signup-project-789");
      });

      it("signs up and redirects to most recent project when no anonymous work", async () => {
        const existingProjects = [{ id: "existing-proj", name: "My Project" }];

        mockSignUpAction.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue(null);
        mockGetProjects.mockResolvedValue(existingProjects);

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signUp("new@example.com", "newpassword123");
        });

        expect(mockPush).toHaveBeenCalledWith("/existing-proj");
      });

      it("signs up and creates new project when no existing data", async () => {
        const newProject = { id: "brand-new-project" };

        mockSignUpAction.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue(null);
        mockGetProjects.mockResolvedValue([]);
        mockCreateProject.mockResolvedValue(newProject);

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signUp("new@example.com", "newpassword123");
        });

        expect(mockCreateProject).toHaveBeenCalledWith({
          name: expect.stringMatching(/^New Design #\d+$/),
          messages: [],
          data: {},
        });
        expect(mockPush).toHaveBeenCalledWith("/brand-new-project");
      });
    });

    describe("error handling", () => {
      it("returns error result when sign up fails with validation error", async () => {
        mockSignUpAction.mockResolvedValue({
          success: false,
          error: "Password must be at least 8 characters",
        });

        const { result } = renderHook(() => useAuth());

        let response;
        await act(async () => {
          response = await result.current.signUp("new@example.com", "short");
        });

        expect(response).toEqual({
          success: false,
          error: "Password must be at least 8 characters",
        });
        expect(mockPush).not.toHaveBeenCalled();
      });

      it("returns error result when email already exists", async () => {
        mockSignUpAction.mockResolvedValue({
          success: false,
          error: "Email already exists",
        });

        const { result } = renderHook(() => useAuth());

        let response;
        await act(async () => {
          response = await result.current.signUp("existing@example.com", "password123");
        });

        expect(response).toEqual({ success: false, error: "Email already exists" });
        expect(mockPush).not.toHaveBeenCalled();
      });

      it("does not redirect when sign up returns unsuccessful", async () => {
        mockSignUpAction.mockResolvedValue({ success: false });

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signUp("test@example.com", "password");
        });

        expect(mockPush).not.toHaveBeenCalled();
      });
    });

    describe("loading state", () => {
      it("sets isLoading to true during sign up and false after", async () => {
        let resolveSignUp: (value: any) => void;
        const signUpPromise = new Promise((resolve) => {
          resolveSignUp = resolve;
        });
        mockSignUpAction.mockReturnValue(signUpPromise);
        mockGetAnonWorkData.mockReturnValue(null);
        mockGetProjects.mockResolvedValue([{ id: "1" }]);

        const { result } = renderHook(() => useAuth());

        expect(result.current.isLoading).toBe(false);

        let signUpPromiseResult: Promise<any>;
        act(() => {
          signUpPromiseResult = result.current.signUp("new@example.com", "password123");
        });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(true);
        });

        await act(async () => {
          resolveSignUp!({ success: true });
          await signUpPromiseResult;
        });

        expect(result.current.isLoading).toBe(false);
      });

      it("sets isLoading to false even when sign up throws", async () => {
        mockSignUpAction.mockRejectedValue(new Error("Server error"));

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          try {
            await result.current.signUp("new@example.com", "password123");
          } catch {
            // Expected to throw
          }
        });

        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("edge cases", () => {
    it("handles getProjects throwing an error", async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockRejectedValue(new Error("Database error"));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.signIn("test@example.com", "password123");
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("handles createProject throwing an error", async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockRejectedValue(new Error("Failed to create project"));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.signIn("test@example.com", "password123");
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("handles multiple concurrent sign in attempts", async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([{ id: "proj-1" }]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await Promise.all([
          result.current.signIn("test1@example.com", "password1"),
          result.current.signIn("test2@example.com", "password2"),
        ]);
      });

      expect(mockSignInAction).toHaveBeenCalledTimes(2);
      expect(result.current.isLoading).toBe(false);
    });

    it("maintains functionality after re-render", async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([{ id: "proj-1" }]);

      const { result, rerender } = renderHook(() => useAuth());

      rerender();

      // Functions should still work after re-render
      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(mockSignInAction).toHaveBeenCalledWith("test@example.com", "password123");
      expect(mockPush).toHaveBeenCalledWith("/proj-1");
    });
  });
});
