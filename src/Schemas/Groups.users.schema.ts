
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserGroupsDocument = UserGroups & Document;

@Schema()
export class UserGroups {
    @Prop({required: true})
    userId: string

    @Prop({required: true})
    groups: string[]
}

export const UserGroupsSchema = SchemaFactory.createForClass(UserGroups);