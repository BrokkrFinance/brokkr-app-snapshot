import { Test, TestingModule } from "@nestjs/testing";
import { UserFirstInvestmentService } from "./user-first-investment-db.service";
import { getModelToken } from "@nestjs/mongoose";
import { UserFirstInvestmentDocument } from "../schemas/UserFirstInvestment.schema";
import { Logger } from "@nestjs/common";

describe("UserFirstInvestmentService", () => {
  let service: UserFirstInvestmentService;

  const mockUserFirstInvestmentModel = {
    distinct: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserFirstInvestmentService,
        Logger,
        {
          provide: getModelToken(UserFirstInvestmentDocument.name),
          useValue: mockUserFirstInvestmentModel,
        },
      ],
    }).compile();

    service = module.get<UserFirstInvestmentService>(UserFirstInvestmentService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
