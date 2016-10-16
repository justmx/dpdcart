# Episode 253: `gen_state_machine`

Erlang 19 came out this week as one of the four amazing ecosystem releases.  It
introduced a lot of stuff, but the most exciting part to me is the introduction
of `gen_statem` to replace `gen_fsm` for building state machines.

antipax built an Elixir wrapper, `gen_state_machine`, to provide a more
idiomatic Elixir interface for it.  Let's use this to implement a basic model of
a door with a numeric lock, which is the example in the erlang documentation.

## Project

### Setup (off video)

We'll kick off a new project and bring in the dependency:

```sh
mix new door_code
cd door_code
vim mix.exs
```

```elixir
  def application do
    [applications: [:logger, :gen_state_machine]]
  end

  defp deps do
    [
      {:gen_state_machine, "~> 1.0"}
    ]
  end
```

```sh
mix deps.get
```

### Implementation

We've got a basic project set up with `gen_state_machine` added to the
dependencies and applications.  Now let's talk about the problem itself.

- We have a door with a coded lock mechanism.
- A user enters a digit.
  - If that digit completes the lock sequence, the door unlocks for some period
    of time.
  - If that digit is the correct next digit but does not complete the lock
    sequence, the door remains locked and awaits the next digit.
  - If that digit is not the next digit expected, the lock resets.

#### High-Level Integration Test

We'll start off with a high level integration test.

```sh
vim test/door_code_test.exs
```

```elixir
defmodule DoorCodeTest do
  use ExUnit.Case
  @code [1, 2, 3]
  @open_time 100

  test "happy path" do
    # We start a door, telling it its code, initializing the remaining digits to
    # be pressed, and how long to remain unlocked.
    {:ok, door} = Door.start_link({@code, @code, @open_time})
    # Verify that it starts out locked
    assert Door.get_state(door) == :locked
    door |> Door.press(1)
    assert Door.get_state(door) == :locked
    door |> Door.press(2)
    assert Door.get_state(door) == :locked
    door |> Door.press(3)
    # Verify that it is unlocked after the correct code is entered
    assert Door.get_state(door) == :open
    :timer.sleep(@open_time)
    # Verify that it is locked again after the specified time
    assert Door.get_state(door) == :locked
  end
end
```

Let's try to run the test and see what we need to do first.  We need to create
our `Door` module with a `start_link` function:

```elixir
defmodule Door do
  def start_link({code, remaining, unlock_time}) do
  end
end
```

We'll make this a `GenStateMachine` and implement `start_link` to begin:

```elixir
defmodule Door do
  use GenStateMachine

  ### Client API
  def start_link({code, remaining, unlock_time}) do
    # The GenStateMachine.start_link function takes the module to start and the
    # initial state as an argument.
    GenStateMachine.start_link(Door, {:locked, {code, remaining, unlock_time}})
  end
end
```

If we run the tests now, we see that we need to implement the `get_state`
function.  We'll just send a `call` to the pid asking for the state.  Here we're
actually going to return the state machine's current state - not its internal
state.  We will refer to its internal state as data instead.

```elixir
defmodule Door do
  # ...
  def get_state(pid) do
    GenStateMachine.call(pid, :get_state)
  end
end
```

If we run the tests now, we'll get an error:

```
  1) test happy path (DoorCodeTest)
     test/door_code_test.exs:19
     ** (EXIT from #PID<0.153.0>) :bad_event



Finished in 0.05 seconds
1 test, 1 failure

Randomized with seed 920102

06:50:42.985 [error] GenStateMachine #PID<0.154.0> terminating
** (exit) :bad_event
    (stdlib) gen_statem.erl:949: :gen_statem.loop_event_result/9
    (stdlib) proc_lib.erl:247: :proc_lib.init_p_do_apply/3
Last message: {{:call, {#PID<0.153.0>, #Reference<0.0.5.96>}}, :get_state}
State: {:locked, {[1, 2, 3], 100}}
Callback mode: :handle_event_function
```

This is telling us that our state machine got an event that it didn't know how
to handle.  We need to build the server's `handle_call` function:

```elixir
defmodule Door do
  # ...
  ### Server API
  def handle_event({:call, from}, :get_state, state, data) do
    {:next_state, state, data, [{:reply, from, state}]}
  end
end
```

Here we handle a call and see who it's from.  The call is to `get_state`.  We
pattern match the current state and the state machine's data.  We then stay in
the current state and reply to the caller with our current state.  This event
will be handled with this code regardless of the current state of the machine.
Let's see if this gets us further in our tests.

Yup.  Now we need to implement `press`.  We'll implement both the client and
server API for this since we know it'll be an issue:

```elixir
defmodule Door do
  # ...
  ### Client API
  # ...
  def press(pid, digit) do
    GenStateMachine.cast(pid, {:press, digit})
  end

  ### Server API
  # ...
  def handle_event(:cast, {:press, digit}, :locked, {code, remaining, unlock_time}) do
    case remaining do
    end
  end
end
```

So this has our shell in place.  Let's start implementing the case statement.

```elixir
  def handle_event(:cast, {:press, digit}, :locked, {code, remaining, unlock_time}) do
    case remaining do
      [digit] ->
        IO.puts "[#{digit}] Correct code.  Unlocked for #{unlock_time}"
        {:next_state, :open, {code, code, unlock_time}, unlock_time}
    end
  end
```

If you complete the code, the door opens, updates its remaining to the full
code, and sets a timeout.  We'll talk about the timeout later.

What about when you enter the correct next digit but there's still part of the
code remaining?

```elixir
  def handle_event(:cast, {:press, digit}, :locked, {code, remaining, unlock_time}) do
    case remaining do
      [digit] ->
        # ...
      [digit|rest] ->
        IO.puts "[#{digit}] Correct digit but not yet complete."
        {:next_state, :locked, {code, rest, unlock_time}}
    end
  end
```

We'll update the remaining stripping this digit off the front and stay locked.

Now what about entering the wrong next digit?

```elixir
  def handle_event(:cast, {:press, digit}, :locked, {code, remaining, unlock_time}) do
    case remaining do
      [digit] ->
        # ...
      [digit|rest] ->
        # ...
      _ ->
        IO.puts "[#{digit}] Wrong digit, locking."
        {:next_state, :locked, {code, code, unlock_time}}
    end
  end
```

We'll lock the door and update remaining to the full code.  How are our tests
now?

```
[1] Correct digit but not yet complete.
[2] Correct digit but not yet complete.
[3] Correct code.  Unlocked for 100.


  1) test happy path (DoorCodeTest)
     test/door_code_test.exs:42
     Assertion with == failed
     code: Door.get_state(door) == :locked
     lhs:  :open
     rhs:  :locked
     stacktrace:
       test/door_code_test.exs:52: (test)
```

OK so everything seems to be working except for locking the door back.  This is
handled with a timeout, but we haven't talked about those yet.

If you return a number after the new data in your `next_state` response, a
timeout event will be generated.  You can handle those like any other event.
Let's make the timeout lock the door back:

```elixir
  def handle_event(:timeout, _, _, data) do
    IO.puts "timeout expired, locking door"
    {:next_state, :locked, data}
  end
```

If we run the tests...they still don't pass.  Why is this?  It turns out that if
any event comes in while a timeout is active, the timeout is cancelled.  Our
state check is an event, so this will cancel the door lock timeout.  Let's
remove that check and see if it works.

```elixir
defmodule DoorCodeTest do
  use ExUnit.Case
  @code [1, 2, 3] # code to open door
  @open_time 100 # milliseconds door remains open after unlock

  test "happy path" do
    {:ok, door} = Door.start_link({@code, @code, @open_time})
    assert Door.get_state(door) == :locked
    door |> Door.press(1)
    assert Door.get_state(door) == :locked
    door |> Door.press(2)
    assert Door.get_state(door) == :locked
    door |> Door.press(3)
    #assert Door.get_state(door) == :open
    :timer.sleep(@open_time)
    assert Door.get_state(door) == :locked
  end
end
```

And it does.  But we'd still like to test that the state remained locked.  How
can we do that without that check breaking the timeout?

There's a function I only learned about in this episode, called
`:sys.get_status`, that returns the status of a given process.  For a
`gen_statem` process, this will be the current state and data.  Let's rework our
public API for `get_state` to use `:sys.get_status` instead of sending in an
event to the state machine, since it's not really a stateful operation at all!

```elixir
  def get_state(pid) do
    result = :sys.get_status(pid)
    IO.inspect result
  end
```

We can run the tests to see what form this data takes:

```
{:status, #PID<0.154.0>, {:module, :gen_statem},
 [["$initial_call": {Door, :init, 1}, "$ancestors": [#PID<0.153.0>]], :running,
  #PID<0.153.0>, [],
  [header: 'Status for state machine <0.154.0>',
   data: [{'Status', :running}, {'Parent', #PID<0.153.0>},
    {'Logged Events', []}, {'Postponed', []}],
   data: [{'State', {:locked, {[1, 2, 3], [1, 2, 3], 100}}}]]]}
```

Alright, so we can pattern match to return that state:

```elixir
  def get_state(pid) do
    result = :sys.get_status(pid)
    # This is a super weird looking pattern match and there has to be a better
    # way to do it, but watching me get it boiled down would be boring so I'll
    # just paste it in.
    {_, _, {_, _}, [_, _, _, _, [_, _, data: [{_, {status, {_, _, _}}}]]]} = result
    status
  end
```

Run the tests again, and they pass.  Now we can add back in our assertion that
the door unlocks:

```elixir
  test "happy path" do
    {:ok, door} = Door.start_link({@code, @code, @open_time})
    assert Door.get_state(door) == :locked
    door |> Door.press(1)
    assert Door.get_state(door) == :locked
    door |> Door.press(2)
    assert Door.get_state(door) == :locked
    door |> Door.press(3)
    assert Door.get_state(door) == :open
    :timer.sleep(@open_time)
    assert Door.get_state(door) == :locked
  end
```

And it passes.

## Summary

Today we saw how to use `GenStateMachine` to build out a state machine backed by
Erlang 19's new `gen_statem` behaviour.  The example was pretty straightforward,
but it still has an error in the implementation - what happens if you press a
button while the door is unlocked?  You should think through it, then write a
test to verify the problem.  Then you might find fixing the problem a fun
exercise - there are hints to this effect in the [OTP Design Principles section
on `gen_state_m`](http://erlang.org/documentation/doc-8.0-rc1/doc/design_principles/statem.html)

I hope you had fun learning about this new OTP behaviour for building state
machines.  See you soon!

## Resources

- [`antipax/gen_state_machine`](https://github.com/antipax/gen_state_machine)
- [`gen_state_machine` ExDoc](https://hexdocs.pm/gen_state_machine/GenStateMachine.html)
- [`gen_state_m` documentation](http://erlang.org/documentation/doc-8.0-rc1/lib/stdlib-3.0/doc/html/gen_statem.html)
- [OTP Design Principles: `gen_state_m` Behaviour](http://erlang.org/documentation/doc-8.0-rc1/doc/design_principles/statem.html)
- [`sys:get_status` documentation](http://erlang.org/documentation/doc-8.0-rc1/lib/stdlib-3.0/doc/html/sys.html#get_status-1)
