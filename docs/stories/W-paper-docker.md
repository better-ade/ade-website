# W-paper-docker: the paper says Docker is in the hub, for isolated local tests

risk: low (copy on the public site; no secret, sign-in, data or money)

## Story

As someone reading how ADE works, I want the paper to say that a hub can run a project's system integration tests
locally in containers, so I know what the hub installs for it and what it leaves to the owner.

Section 3 gains 3.8, "Isolated local tests", for ade-brain story V4 (merged as a26d82e): Colima on macOS, `docker.io`
and `docker-compose-v2` from `bin/server install` on Linux, ports published on loopback only, recommended not needed,
and the `docker` group never joined for the owner. The PDF is rebuilt with the same section.

## Acceptance criteria (tests/sitePaper.test.ts)

1. Section 3.8 names what ade-brain's main installs (bin/lib.sh's Homebrew line, bin/server's `server_docker`), the
   loopback default (bin/server's daemon.json), that nothing runs `usermod`/`gpasswd`, and that a missing Docker is a
   warning.
