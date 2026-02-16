import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { WorkflowModule } from './workflow/workflow.module';
import { FormModule } from './form/form.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AiModule } from './ai/ai.module';
import { LineModule } from './line/line.module';

@Module({
  imports: [PrismaModule, AuthModule, WorkflowModule, FormModule, DashboardModule, AiModule, LineModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
