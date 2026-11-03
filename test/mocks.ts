/**
 * Mocks partagés pour les tests unitaires.
 * Chaque spec ne teste que la résolution DI / la logique pure,
 * aucune connexion réelle à la base ou à Cloudinary n'est effectuée.
 */

export const prismaMock = {
  user: {},
  article: {},
  verification: {},
  evidence: {},
  topic: {},
  media: {},
  comment: {},
  $transaction: async () => [0, []],
};

export const cloudinaryMock = {
  uploadPrivate: async () => ({ public_id: 'proofs/mock', secure_url: 'https://cdn.example.com/proof.jpg' }),
  uploadPublic: async () => ({ public_id: 'gallery/mock', secure_url: 'https://cdn.example.com/img.jpg' }),
  getSignedUrl: () => 'https://cdn.example.com/signed',
  delete: async () => ({ result: 'ok' }),
};

export const jwtServiceMock = {
  signAsync: async () => 'mock.jwt.token',
};

export const mailServiceMock = {
  sendVerificationCode: async () => undefined,
};
