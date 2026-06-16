/**
 * A legacy (experimentalDecorators) property decorator that also constrains the decorated field's
 * declared type. `Output` is the value the decorator produces. The field must be wide enough to hold
 * it, so a field narrower than `Output` fails to compile while a wider or nullable field is accepted.
 * The tuple wrap stops `Output` from distributing when it is a union.
 * @public
 */
export type EnvaptFieldDecorator<Output> = <Target, Key extends keyof Target>(
    target: Target,
    key: [Output] extends [Target[Key]] ? Key : { '[envapt] field type must hold the converter output': Output }
) => void;

/**
 * A modern (TC39 Stage 3) accessor decorator that also constrains the decorated `accessor`'s
 * declared type. `Output` is the value the decorator produces. The accessor must be wide enough to
 * hold it, so an accessor narrower than `Output` fails to compile while a wider or nullable one is
 * accepted. The tuple wrap stops `Output` from distributing when it is a union.
 * @public
 */
export type EnvaptAccessorDecorator<Output> = <This, Value>(
    target: ClassAccessorDecoratorTarget<
        This,
        [Output] extends [Value] ? Value : { '[envapt] field type must hold the converter output': Output }
    >,
    context: ClassAccessorDecoratorContext<
        This,
        [Output] extends [Value] ? Value : { '[envapt] field type must hold the converter output': Output }
    >
) => ClassAccessorDecoratorResult<This, Value>;
