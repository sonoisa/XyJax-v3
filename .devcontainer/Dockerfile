FROM ubuntu:18.04

# RUN if ! [ "$(arch)" = "aarch64" ] ; then exit 1; fi

#Install core OS packages
RUN apt-get -y update && \
    apt-get -y install software-properties-common --no-install-recommends && \
    add-apt-repository ppa:ubuntu-toolchain-r/test && \
    apt-get -y install --no-install-recommends \
      autoconf \
      bc \
      build-essential \
      cmake \
      curl \
      g++-9 \
      gcc-9 \
      gettext-base \
      gfortran-9 \
      git \
      iputils-ping \
      libbz2-dev \
      libc++-dev \
      libcgal-dev \
      libffi-dev \
      libfreetype6-dev \
      libhdf5-dev \
      libjpeg-dev \
      liblzma-dev \
      libncurses5-dev \
      libncursesw5-dev \
      libpng-dev \
      libreadline-dev \
      libssl-dev \
      libsqlite3-dev \
      libxml2-dev \
      libxslt-dev \
      locales \
      moreutils \
      openssl \
      rsync \
      ssh \
      sudo \
      time \
      unzip \
      vim \
      wget \
      xz-utils \
      zip \
      zlib1g-dev \
    && apt-get -y clean \
    && rm -rf /var/lib/apt/lists/*

# Make gcc 9 the default
RUN update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-9 1 --slave /usr/bin/g++ g++ /usr/bin/g++-9 && \
    update-alternatives --install /usr/bin/gfortran gfortran /usr/bin/gfortran-9 1

# DOCKER_USER for the Docker user
ENV DOCKER_USER=ubuntu

# Setup default user
RUN useradd --create-home -s /bin/bash -m $DOCKER_USER && echo "$DOCKER_USER:Arm2020" | chpasswd && adduser $DOCKER_USER sudo
RUN echo '%sudo ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers
RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections

# Import profile for bash
COPY .devcontainer/bash_profile /home/$DOCKER_USER/.bash_profile
RUN chown $DOCKER_USER:$DOCKER_USER /home/$DOCKER_USER/.bash_profile

WORKDIR /home/$DOCKER_USER
USER $DOCKER_USER

ENV NVM_DIR=/home/$DOCKER_USER/.nvm

# install node
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.2/install.sh | bash \
  && . /home/$DOCKER_USER/.nvm/nvm.sh \
  && nvm install stable \
  && nvm alias default stable \
  && nvm use default

CMD ["/bin/bash", "-l"]
