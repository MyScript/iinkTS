import * as React from 'react';
import React__default from 'react';
import { Slot } from '@radix-ui/react-slot';

type Scope<C = any> = {
    [scopeName: string]: React.Context<C>[];
} | undefined;
type ScopeHook = (scope: Scope) => {
    [__scopeProp: string]: Scope;
};
interface CreateScope {
    scopeName: string;
    (): ScopeHook;
}

type SlotProps = React__default.ComponentPropsWithoutRef<typeof Slot>;
interface CollectionProps extends SlotProps {
    scope: any;
}
declare function createCollection<ItemElement extends HTMLElement, ItemData = {}>(name: string): readonly [{
    readonly Provider: React__default.FC<{
        children?: React__default.ReactNode;
        scope: any;
    }>;
    readonly Slot: React__default.ForwardRefExoticComponent<CollectionProps & React__default.RefAttributes<HTMLElement>>;
    readonly ItemSlot: React__default.ForwardRefExoticComponent<React__default.PropsWithoutRef<ItemData & {
        children: React__default.ReactNode;
        scope: any;
    }> & React__default.RefAttributes<ItemElement>>;
}, (scope: any) => () => ({
    ref: React__default.RefObject<ItemElement>;
} & ItemData)[], CreateScope];

export { type CollectionProps, createCollection };
