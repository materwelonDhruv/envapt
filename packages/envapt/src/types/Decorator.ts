// legacy property decorator that also constrains the field type, a field narrower than Output fails to
// compile. the [Output] tuple wrap stops Output from distributing when it is a union.
export type EnvaptFieldDecorator<Output> = <Target, Key extends keyof Target>(
    target: Target,
    key: [Output] extends [Target[Key]] ? Key : { '[envapt] field type must hold the converter output': Output }
) => void;

// modern accessor decorator that also constrains the accessor type, one narrower than Output fails to
// compile. the [Output] tuple wrap stops Output from distributing when it is a union.
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
