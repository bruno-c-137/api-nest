import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TavusService } from './tavus.service';

@Module({
  imports: [HttpModule],
  providers: [TavusService],
  exports: [TavusService],
})
export class TavusModule {}
