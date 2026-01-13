import { Injectable } from '@nestjs/common';
import { CreateResponsibilityDto } from './dto/create-responsibility.dto';
import { ResponsibilityState } from './responsibility.state';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ResponsibilityService {

    constructor(private prisma:PrismaService){}

    async create(dto: CreateResponsibilityDto){
        const responsibility= await this.prisma.responsibility.create({
            data:{
                title:dto.title,
                category:dto.category,
                dueDate: new Date(dto.dueDate),
                userId: dto.userId
            }
        })

        return responsibility
    };

    private computeState(
        dueDate: Date,
        completedAt: Date | null,
    ): ResponsibilityState{

        if(completedAt){
            return ResponsibilityState.COMPLETED
        }

        const today= new Date();
        const due = dueDate;

        if(today > due){
            return ResponsibilityState.OVERDUE
        }
        if(today.toDateString() === due.toDateString()){
            return ResponsibilityState.DUE
        }

        return ResponsibilityState.UPCOMING
    }

    async markComplete(id: String){

        return await this.prisma.responsibility.update({
            where: {
                id: Number(id)
            },
            data:{
                completedAt: new Date()
            }
        })
    }

    async getByUser
    (userId: number, state?: string, category?: string
    ){
        const responsibilities= await this.prisma.responsibility.findMany({
            where:{
                userId,
                ...(category && {category})
            },
            orderBy:{
                createdAt: 'desc'
            }
        })
        return responsibilities.map((r)=>({
            ...r,
            state: this.computeState(r.dueDate, r.completedAt),
        }))
        .filter((r) => (state ? r.state === state : true));
    }

    async getById
    (id: number){
        const responsibilities= await this.prisma.responsibility.findUnique({
            where:{
                id,
            }
        })
        if (!responsibilities) {
    return null;
  }
        return {
            ...responsibilities,
            state: this.computeState(
                responsibilities.dueDate,
                responsibilities.completedAt
            )
        }
    }

    async delete(id:number){
        return await this.prisma.responsibility.delete({
            where: {id}
        })
    }
}
