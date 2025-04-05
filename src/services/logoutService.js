export const logoutUserService = async (userId) => {
    // Delete all refresh tokens associated with the user
    await prisma.token.deleteMany({
      where: { userId },
    });
  };