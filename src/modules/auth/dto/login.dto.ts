import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsString } from "class-validator";

export class LoginDto{
	@ApiProperty({example: "heramamo@gmail.com", description:"Email"})
	@Transform(({ value }) =>
		typeof value === 'string' ? value.trim().toLowerCase() : value,
	)
	@IsEmail()
	email!:string

	@ApiProperty({example: "motdepasse123", description:"Mot de passe"})
	@IsString()
	password!:string
}
