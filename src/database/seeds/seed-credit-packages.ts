import { DataSource } from 'typeorm';
import { CreditPackage } from '../../modules/credits/entities/credit-package.entity';

export async function seedCreditPackages(dataSource: DataSource) {
  const creditPackageRepository = dataSource.getRepository(CreditPackage);

  const packages = [
    {
      name: 'Starter Pack',
      credits: 5,
      price: 4999, // $49.99
      isActive: true,
    },
    {
      name: 'Pro Pack',
      credits: 10,
      price: 8999, // $89.99
      isActive: true,
    },
    {
      name: 'Premium Pack',
      credits: 20,
      price: 15999, // $159.99
      isActive: true,
    },
  ];

  for (const pkg of packages) {
    const existing = await creditPackageRepository.findOne({
      where: { name: pkg.name },
    });

    if (!existing) {
      const creditPackage = creditPackageRepository.create(pkg);
      await creditPackageRepository.save(creditPackage);
    }
  }
}
