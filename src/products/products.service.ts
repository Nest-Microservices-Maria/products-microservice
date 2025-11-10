import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger('ProductsService');
  onModuleInit() {
    this.$connect();
    this.logger.log('Connected to the database');
  }

  create(createProductDto: CreateProductDto) {    
    return this.product.create({
      data: createProductDto
    });
  }

  async findAll( paginationDto: PaginationDto) {

    //const { page, limit } = paginationDto;
    const pageRaw = paginationDto.page ?? 1;
    const limitRaw = paginationDto.limit ?? 10;

    const pageNum = Number(pageRaw);
    const limitNum = Number(limitRaw);

    // ensure positive integers
    const page = Number.isFinite(pageNum) && pageNum > 0 ? Math.floor(pageNum) : 1;
    const limit = Number.isFinite(limitNum) && limitNum > 0 ? Math.floor(limitNum) : 10;

    const totalPages = await this.product.count({where: { available: true }});
    const lastPage = Math.ceil( totalPages / limit );

    return {
      data: await this.product.findMany({
        skip: ( page - 1 ) * limit,
        take: limit,
        where: { available: true }
      }),
      meta: {
        total: totalPages,
        page: page,
        lastPage: lastPage,
      }
    }
  }

  async findOne(id: number) {
    const product = await this.product.findFirst({
      where: { id: id, available: true}
    });

    if ( !product ) {
      throw new NotFoundException(`Product with id #${id} not found`);
    }
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {

    const { id: _, ...data} = updateProductDto;

    await this.findOne(id);

    return this.product.update({
      where: { id: id },
      data: data,
    });
  }

  async remove(id: number) {

    await this.findOne(id);

    //return this.product.delete({
    //  where: { id: id }
    //});
    const product = await this.product.update({
      where: { id: id },
      data: { available: false }
    });
    return product;
  }

}
