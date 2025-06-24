import {
  User,
  UserPreferences,
  UserRepository,
  UserZodSchema,
} from "app-types/user";
import { generateHashedPassword } from "lib/db/utils";
import { pgDb as db } from "../db.pg";
import { UserSchema } from "../schema.pg";
import { eq } from "drizzle-orm";

export const pgUserRepository: UserRepository = {
  register: async (
    user: Omit<User, "id"> & { plainPassword: string },
  ): Promise<User> => {
    const parsedUser = UserZodSchema.parse({
      ...user,
      password: user.plainPassword,
    });
    const exists = await pgUserRepository.existsByEmail(parsedUser.email);
    if (exists) {
      throw new Error("User already exists");
    }

    const hashedPassword = generateHashedPassword(parsedUser.password);
    const result = await db
      .insert(UserSchema)
      .values({ ...parsedUser, password: hashedPassword })
      .returning();
    const userObj = result[0];
    return {
      ...userObj,
      preferences: userObj.preferences ?? undefined,
    };
  },
  existsByEmail: async (email: string): Promise<boolean> => {
    const result = await db
      .select()
      .from(UserSchema)
      .where(eq(UserSchema.email, email));
    return result.length > 0;
  },
  selectByEmail: async (
    email: string,
  ): Promise<(User & { password: string }) | null> => {
    const [result] = await db
      .select()
      .from(UserSchema)
      .where(eq(UserSchema.email, email));
    if (!result) return null;
    return {
      ...result,
      preferences: result.preferences ?? undefined,
    };
  },
  updateUser: async (
    id: string,
    user: Pick<User, "name" | "image">,
  ): Promise<User> => {
    const [result] = await db
      .update(UserSchema)
      .set({
        name: user.name,
        image: user.image,
        updatedAt: new Date(),
      })
      .where(eq(UserSchema.id, id))
      .returning();
    return {
      ...result,
      preferences: result.preferences ?? undefined,
    };
  },
  updatePreferences: async (
    userId: string,
    preferences: UserPreferences,
  ): Promise<User> => {
    const [result] = await db
      .update(UserSchema)
      .set({
        preferences,
        updatedAt: new Date(),
      })
      .where(eq(UserSchema.id, userId))
      .returning();
    return {
      ...result,
      preferences: result.preferences ?? undefined,
    };
  },
  getPreferences: async (userId: string) => {
    const [result] = await db
      .select({ preferences: UserSchema.preferences })
      .from(UserSchema)
      .where(eq(UserSchema.id, userId));
    return result?.preferences ?? null;
  },
  findById: async (userId: string) => {
    const [result] = await db
      .select()
      .from(UserSchema)
      .where(eq(UserSchema.id, userId));
    return (result as User) ?? null;
  },
};
