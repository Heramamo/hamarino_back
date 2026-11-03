import { Controller, Get, Param, ParseIntPipe, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './user.service';
import { JwtAuthGuard } from '../../guards/jwt.guard.js';
import type { AppRequestUser } from '../../common/request-user.js';

@Controller('user')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UsersService) {}

  @Get('me')
  getCurrentUser(@Req() req: { user: AppRequestUser }) {
    return this.userService.getCurrentUser(req.user);
  }

  @Get(':id/proofs')
  @ApiOperation({
    summary: 'Consulter les pièces d’identité (propriétaire ou administrateur)',
  })
  getProofs(
    @Req() req: { user: AppRequestUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.userService.getProofUrls(req.user, id);
  }
}
